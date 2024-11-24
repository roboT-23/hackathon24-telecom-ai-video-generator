<script setup>
import { mdiLightbulbOutline } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import { marked } from 'marked'

import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const step = ref(1)
const selectedIdea = ref(null)
const selectedPrompt = ref(null)
const selectedWizard = ref(null)
const createNewWizard = ref(true)
const wizards = ref([])
const wizardDetails = ref(null)
const ideas = ref([])
const prompts = ref([])
const results = ref(null)
const loading = ref(false)
const error = ref(null)
const isCollapsed = ref(true)
const weatherQueryResponse = ref(null)
const existingWeatherQuery = ref(null) // Initialize as null
const scenes = ref([])


// Fetch data for ideas, prompts, and wizards
const fetchIdeas = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/ideas')
    ideas.value = response.data
  } catch (err) {
    console.error('Error fetching ideas:', err)
    error.value = 'Failed to fetch ideas'
  }
}
const saveWizardProgress = async () => {
  if (!selectedIdea.value || !selectedPrompt.value) {
    console.error('Idea or Prompt is not selected');
    error.value = 'Please select both an idea and a prompt.';
    return;
  }

  try {
    loading.value = true;

    const response = await axios.post('http://localhost:3000/api/wizards', {
      idea_id: selectedIdea.value,
      prompt_id: selectedPrompt.value,
    });

    console.log('Wizard created:', response.data); // Debugging output

    // Fetch wizard details and set them for the next step
    await fetchWizardDetails(response.data.id);

    // Move to Step 2
    step.value = 2;
    loading.value = false;
  } catch (err) {
    console.error('Error saving wizard progress:', err.response?.data || err);
    error.value = err.response?.data?.error || 'Failed to save wizard progress';
    loading.value = false;
  }
};

const fetchPrompts = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/prompts')
    prompts.value = response.data
  } catch (err) {
    console.error('Error fetching prompts:', err)
    error.value = 'Failed to fetch prompts'
  }
}

const fetchWizards = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/wizards')
    wizards.value = response.data
  } catch (err) {
    console.error('Error fetching wizards:', err)
    error.value = 'Failed to fetch wizards'
  }
}

// Fetch wizard details when continuing with an existing wizard
const fetchWizardDetails = async (wizardId) => {
  try {
    loading.value = true
    const response = await axios.get(`http://localhost:3000/api/wizards/${wizardId}`)
    wizardDetails.value = response.data

    // Fetch any existing weather query for this wizard
    await fetchWeatherQuery(wizardId)

    loading.value = false
  } catch (err) {
    console.error('Error fetching wizard details:', err)
    error.value = 'Failed to fetch wizard details'
    loading.value = false
  }
}

// Fetch existing weather query for the selected wizard
const fetchWeatherQuery = async (wizardId) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/weather-queries/${wizardId}`)
    existingWeatherQuery.value = response.data || null // Gracefully handle no data
  } catch (err) {
    console.error('Error fetching weather query:', err)
    existingWeatherQuery.value = null // Ensure it's explicitly set to null
  }
}

// Generate a weather query and proceed to Step 3
const generateWeatherQuery = async () => {
  if (!wizardDetails.value) {
    error.value = 'Wizard details are not loaded.'
    return
  }

  const payload = {
    wizard_id: wizardDetails.value.id,
    idea_name: wizardDetails.value.idea?.name,
    description: wizardDetails.value.idea?.description,
    prompt_content: wizardDetails.value.prompt?.content,
  }

  try {
    loading.value = true
    const response = await axios.post('http://localhost:3000/api/weather-query', payload)
    weatherQueryResponse.value = response.data.response // Store the new response
    loading.value = false
    step.value = 3 // Proceed to Step 3
  } catch (err) {
    console.error('Error generating weather query:', err)
    error.value = 'Failed to generate weather query.'
    loading.value = false
  }
}

// Use existing weather query and proceed to Step 3
const useExistingWeatherQuery = () => {
  if (existingWeatherQuery.value) {
    weatherQueryResponse.value = existingWeatherQuery.value.response
    step.value = 3 // Proceed to Step 3
  }
}

const processWeatherData = async () => {
  try {
    loading.value = true;

    let weatherQuery;

    // Use existing query if available
    if (existingWeatherQuery.value) {
      console.log('Using existing weather query:', existingWeatherQuery.value.response);
      weatherQuery = existingWeatherQuery.value.response;
    } else if (wizardDetails.value) {
      // Extract query from wizardDetails
      const { location, latitude, longitude, data_type, frequency } = wizardDetails.value;
      if (!location || !latitude || !longitude || !data_type || !frequency) {
        throw new Error('Wizard details are incomplete.');
      }
      weatherQuery = { location, latitude, longitude, data_type, frequency };
    } else {
      throw new Error('No valid weather query or wizard details available.');
    }

    console.log('Processing weather data with query:', weatherQuery);

    // Send the query to the backend
    // const response = await axios.post('http://localhost:3000/api/process-weather', { weather_query: weatherQuery });
    const response = await axios.post('http://localhost:3000/api/process-weather-simulated', { weather_query: weatherQuery });
    results.value = response.data;

    console.log('Weather data processed:', response.data);
    step.value = 4; // Move to Step 4
    loading.value = false;
  } catch (err) {
    console.error('Error processing weather data:', err.response?.data || err.message);
    error.value = err.response?.data?.error || 'Failed to process weather data.';
    loading.value = false;
  }
};
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const videoGenerationProgress = ref(null);

// Generate scenes
const generateScenes = async () => {
  try {
    loading.value = true
    const response = await axios.post('http://localhost:3000/api/scenes', {
      wizard_id: wizardDetails.value.id,
      weather_query: weatherQueryResponse.value,
      weather_data: results.value.results,
    })
    scenes.value = response.data.scenes // Correctly assign to scenes
  } catch (err) {
    error.value = 'Failed to generate scenes.'
  } finally {
    loading.value = false
  }
}

// Start video rendering
const startVideoRendering = async () => {
  try {
    videoGenerationProgress.value = 'Adding render job to the queue...';

    // Add render job to the queue
    const queueResponse = await axios.post('http://localhost:3000/api/render-queue', {
      wizard_id: wizardDetails.value.id,
      type: 'weather_analysis',
    });

    const renderJobId = queueResponse.data.id;
    videoGenerationProgress.value = 'Render job added to the queue. Starting video rendering...';

    // Call the backend to start rendering
    const response = await axios.post('http://localhost:3000/api/create-video', {
      wizard_id: wizardDetails.value.id,
      render_job_id: renderJobId, // Pass the queue job ID
    });

    videoGenerationProgress.value = response.data.message || 'Video successfully generated!';
  } catch (err) {
    console.error('Error starting video rendering:', err.message);
    videoGenerationProgress.value = 'Failed to generate video. Please try again.';
  }
};



onMounted(() => {
  fetchIdeas()
  fetchPrompts()
  fetchWizards()
})

// Computed properties for names
</script>


<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiLightbulbOutline" title="Wizard" main>
        <p v-if="step === 1">Step 1: Create a new wizard or continue with an existing one</p>
        <p v-else-if="step === 2">Step 2: Wizard details</p>
        <p v-else-if="step === 3">Step 3: Fetch and process data</p>
        <p v-else-if="step === 4">Step 4: View results</p>
      </SectionTitleLineWithButton>

      <!-- Step 1: Select Wizard -->
      <div v-if="step === 1">
        <CardBox>
          <h3>Select Wizard Option</h3>
          <div class="mb-4">
            <label>
              <input
                type="radio"
                v-model="createNewWizard"
                :value="true"
              />
              Create a New Wizard
            </label>
            <label>
              <input
                type="radio"
                v-model="createNewWizard"
                :value="false"
              />
              Continue with an Existing Wizard
            </label>
          </div>

          <!-- New Wizard Form -->
          <div v-if="createNewWizard">
            <h3>Select an Idea</h3>
            <select
              v-model="selectedIdea"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
            >
              <option v-for="idea in ideas" :key="idea.id" :value="idea.id">{{ idea.name }}</option>
            </select>

            <h3>Select a Prompt</h3>
            <select
              v-model="selectedPrompt"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
            >
              <option v-for="prompt in prompts" :key="prompt.id" :value="prompt.id">{{ prompt.name }}</option>
            </select>

            <button
              @click="saveWizardProgress"
              class="bg-blue-500 text-white rounded-lg px-4 py-2 mt-4"
            >
              Next
            </button>
          </div>

          <!-- Existing Wizard Selection -->
          <div v-else>
            <h3>Select an Existing Wizard</h3>
            <select
              v-model="selectedWizard"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
            >
              <option v-for="wizard in wizards" :key="wizard.id" :value="wizard.id">
                {{ wizard.id }}
              </option>
            </select>
            <button
              @click="fetchWizardDetails(selectedWizard); step = 2"
              class="bg-blue-500 text-white rounded-lg px-4 py-2 mt-4"
            >
              Next
            </button>
          </div>
        </CardBox>
      </div>

      <!-- Step 2: Wizard Details -->
      <div v-if="step === 2">
        <CardBox>
          <h3>Wizard Details</h3>
          <p><strong>Idea:</strong> {{ wizardDetails?.idea?.name || 'Unknown' }}</p>
          <p><strong>Description:</strong> {{ wizardDetails?.idea?.description || 'No description' }}</p>
          <p><strong>Prompt:</strong> {{ wizardDetails?.prompt?.name || 'Unknown' }}</p>
          <p>
            <strong>Description:</strong>
            <button
              @click="toggleCollapse"
              class="bg-gray-500 text-white rounded-lg px-2 py-1 ml-2"
            >
              {{ isCollapsed ? 'Show' : 'Hide' }}
            </button>
          </p>

          <div v-if="!isCollapsed" class="mt-2 border border-gray-300 rounded p-4 dark:bg-slate-800">
            <div v-html="marked(wizardDetails?.prompt?.content || '')"></div>
          </div>
          <div v-if="existingWeatherQuery !== null">
            <button
              @click="useExistingWeatherQuery"
              class="bg-green-500 text-white rounded-lg px-4 py-2 mt-4"
              :disabled="!existingWeatherQuery"
            >
              Use Existing Weather Query
            </button>
          </div>
          <button
            @click="generateWeatherQuery"
            class="bg-blue-500 text-white rounded-lg px-4 py-2 mt-4"
            :disabled="loading"
          >
            Generate New Weather Query
          </button>
        </CardBox>
      </div>

      <div v-if="step === 3">
        <CardBox>
          <h3>Process Weather Data</h3>
          <p><strong>Idea:</strong> {{ wizardDetails?.idea?.name || 'Unknown' }}</p>
          <p><strong>Description:</strong> {{ wizardDetails?.idea?.description || 'No description' }}</p>
          <p>
            <strong>Description:</strong>
            <button
              @click="toggleCollapse"
              class="bg-gray-500 text-white rounded-lg px-2 py-1 ml-2"
            >
              {{ isCollapsed ? 'Show' : 'Hide' }}
            </button>
          </p>

          <div v-if="!isCollapsed" class="mt-2 border border-gray-300 rounded p-4 dark:bg-slate-800">
            <div v-html="marked(wizardDetails?.prompt?.content || '')"></div>
          </div>

          <p>Using weather query: <code class="text-sm">{{ weatherQueryResponse }}</code></p>
          <button
            @click="processWeatherData"
            class="bg-green-500 text-white rounded-lg px-4 py-2 mt-4"
            :disabled="loading"
          >
            Process Weather Data
          </button>
        </CardBox>
      </div>

      <div v-if="step === 4">
        <CardBox>
          <h3>Results</h3>

          <!-- Status Message -->
          <div v-if="results && results.message" class="mb-4">
            <p
              v-if="results.error"
              class="text-red-500 font-semibold"
            >
              ❌ Error: {{ results.error }}
            </p>
            <p
              v-else
              class="text-green-500 font-semibold"
            >
              ✅ {{ results.message }}
            </p>
          </div>

          <!-- Collapsible Results Section -->
          <div v-if="!results?.error">
            <button
              @click="toggleCollapse"
              class="bg-gray-500 text-white rounded-lg px-4 py-2 mb-4"
            >
              {{ isCollapsed ? 'Show Results' : 'Hide Results' }}
            </button>

            <div v-if="!isCollapsed" class="mt-2 border border-gray-300 rounded p-4 dark:bg-slate-800">
              <pre>{{ JSON.stringify(results?.results, null, 2) }}</pre>
            </div>
          </div>

          <!-- Video Creation Section -->
          <div v-if="!results?.error">
            <button
              class="bg-blue-500 text-white rounded-lg px-4 py-2 mt-4"
              @click="generateScenes">
              Generate Video Scenes
            </button>
          </div>
          <div v-if="scenes">
            <h3>Generated Scenes:</h3>
            <pre>{{ scenes }}</pre>
            <button
              class="bg-green-500 text-white rounded-lg px-4 py-2 mt-4"
              @click="startVideoRendering">
              Create Video
            </button>
          </div>

          <!-- Placeholder for Video Generation -->
          <div v-if="videoGenerationProgress" class="mt-4 border border-blue-500 rounded p-4">
            <h4 class="text-blue-500 font-semibold">Video Generation Status</h4>
            <p>{{ videoGenerationProgress }}</p>
          </div>
        </CardBox>
      </div>




    </SectionMain>
  </LayoutAuthenticated>
</template>

