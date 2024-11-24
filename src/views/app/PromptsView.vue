<script setup>
import { mdiTextBoxEditOutline, mdiPlus, mdiRefresh } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import BaseButton from '@/components/BaseButton.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import TableAllPrompts from '@/components/app/TableAllPrompts.vue'

import { ref, onMounted } from 'vue'
import axios from 'axios'

// References for prompts and form states
const prompts = ref([])
const loading = ref(true)
const error = ref(null)
const isCreatingPrompt = ref(false) // Indicates if the creation form is open
const newPrompt = ref({
  name: '',
  description: '',
  type: ['tutorial', 'weather_analysis']
})

// Fetch the list of prompts
const fetchPrompts = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/prompts')
    prompts.value = response.data
    loading.value = false
  } catch (err) {
    error.value = 'Failed to fetch prompts'
    loading.value = false
    console.error('Error fetching prompts:', err)
  }
}

// Create a new idea
const createPrompt = async () => {
  try {
    await axios.post('http://localhost:3000/api/prompts', newPrompt.value)
    fetchPrompts() // Refresh the list of prompts
    cancelCreate() // Close the creation form
  } catch (err) {
    console.error('Error creating idea:', err)
    alert('Failed to create the idea')
  }
}

// Cancel the form and reset state
const cancelCreate = () => {
  isCreatingPrompt.value = false
  newPrompt.value = { name: '', description: '', type: 'tutorial' }
}

onMounted(() => {
  fetchPrompts()
})
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiTextBoxEditOutline" title="Prompts" main>
        <BaseButton
          :icon="mdiPlus"
          label="Create Prompt"
          color="contrast"
          rounded-full
          small
          @click="isCreatingPrompt = true"
        />
        <BaseButton
          label="Refresh"
          :icon="mdiRefresh"
          color="contrast"
          rounded-full
          small
          @click="fetchPrompts"
        />
      </SectionTitleLineWithButton>

      <!-- Inline form for creating a new idea -->
      <CardBox v-if="isCreatingPrompt" class="mb-6">
        <h3 class="text-lg font-semibold mb-4">Add a New Prompt</h3>
        <form @submit.prevent="createPrompt">
          <div class="mb-4">
            <label for="name" class="block text-sm font-medium mb-1">Name:</label>
            <input
              v-model="newPrompt.name"
              id="name"
              type="text"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
              required
            />
          </div>
          <!-- Content -->
          <div class="mb-4">
            <label for="content" class="block text-sm font-medium mb-1">Content:</label>
            <textarea
              v-model="newPrompt.content"
              id="content"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-24 border bg-white dark:bg-slate-800"
              rows="3"
              placeholder="Write your prompt content here..."
              required
            ></textarea>
          </div>

          <!-- Type -->
          <div class="mb-4">
            <label for="type" class="block text-sm font-medium mb-1">Type:</label>
            <select
              v-model="newPrompt.type"
              id="type"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
              required
            >
              <option v-for="type in ['tutorial', 'weather_analysis']" :key="type" :value="type">{{ type }}</option>
              <!-- Ak pridáš ďalšie typy, môžu byť tu -->
            </select>
          </div>

          <!-- Language -->
          <div class="mb-4">
            <label for="language" class="block text-sm font-medium mb-1">Language:</label>
            <select
              v-model="newPrompt.language"
              id="language"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
              required
            >
              <option value="en">English</option>
              <option value="sk">Slovak</option>
            </select>
          </div>

          <!-- Submit and Cancel -->
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              class="bg-gray-300 text-gray-800 rounded-lg px-4 py-2"
              @click="cancelCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-blue-500 text-white rounded-lg px-4 py-2"
            >
              Save
            </button>
          </div>
        </form>
      </CardBox>


      <!-- Table of prompts -->
      <CardBox class="mb-6" has-table>
        <TableAllPrompts
          :prompts="prompts"
          :loading="loading"
          :error="error"
          checkable
        />
      </CardBox>

      <!-- Empty state if no prompts exist -->
      <CardBox v-if="!loading && !error && !prompts.length">
        <CardBoxComponentEmpty message="No prompts available to display." />
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
