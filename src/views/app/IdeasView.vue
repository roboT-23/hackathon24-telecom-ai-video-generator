<script setup>
import { mdiLightbulbOutline, mdiPlus, mdiRefresh } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import BaseButton from '@/components/BaseButton.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import TableAllIdeas from '@/components/app/TableAllIdeas.vue'

import { ref, onMounted } from 'vue'
import axios from 'axios'

// References for ideas and form states
const ideas = ref([])
const loading = ref(true)
const error = ref(null)
const isCreatingIdea = ref(false) // Indicates if the creation form is open
const newIdea = ref({
  name: '',
  description: '',
  type: 'tutorial'
})

// Fetch the list of ideas
const fetchIdeas = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/ideas')
    ideas.value = response.data
    loading.value = false
  } catch (err) {
    error.value = 'Failed to fetch ideas'
    loading.value = false
    console.error('Error fetching ideas:', err)
  }
}

// Create a new idea
const createIdea = async () => {
  try {
    await axios.post('http://localhost:3000/api/ideas', newIdea.value)
    fetchIdeas() // Refresh the list of ideas
    cancelCreate() // Close the creation form
  } catch (err) {
    console.error('Error creating idea:', err)
    alert('Failed to create the idea')
  }
}

// Cancel the form and reset state
const cancelCreate = () => {
  isCreatingIdea.value = false
  newIdea.value = { name: '', description: '', type: 'tutorial' }
}

onMounted(() => {
  fetchIdeas()
})
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiLightbulbOutline" title="Ideas" main>
        <BaseButton
          :icon="mdiPlus"
          label="Create Idea"
          color="contrast"
          rounded-full
          small
          @click="isCreatingIdea = true"
        />
        <BaseButton
          label="Refresh"
          :icon="mdiRefresh"
          color="contrast"
          rounded-full
          small
          @click="fetchIdeas"
        />
      </SectionTitleLineWithButton>

      <!-- Inline form for creating a new idea -->
      <CardBox v-if="isCreatingIdea" class="mb-6">
        <h3 class="text-lg font-semibold mb-4">Add a New Idea</h3>
        <form @submit.prevent="createIdea">
          <div class="mb-4">
            <label for="name" class="block text-sm font-medium mb-1">Name:</label>
            <input
              v-model="newIdea.name"
              id="name"
              type="text"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
              required
            />
          </div>
          <div class="mb-4">
            <label for="description" class="block text-sm font-medium mb-1">Description:</label>
            <textarea
              v-model="newIdea.description"
              id="description"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-24 border bg-white dark:bg-slate-800"
              rows="3"
              required
            ></textarea>
          </div>
          <div class="mb-4">
            <label for="type" class="block text-sm font-medium mb-1">Type:</label>
            <select
              v-model="newIdea.type"
              id="type"
              class="px-3 py-2 max-w-full focus:ring focus:outline-none border-gray-700 rounded w-full dark:placeholder-gray-400 h-12 border bg-white dark:bg-slate-800"
              required
            >
              <option value="tutorial">Tutorial</option>
            </select>
          </div>
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

      <!-- Table of ideas -->
      <CardBox class="mb-6" has-table>
        <TableAllIdeas
          :ideas="ideas"
          :loading="loading"
          :error="error"
          checkable
        />
      </CardBox>

      <!-- Empty state if no ideas exist -->
      <CardBox v-if="!loading && !error && !ideas.length">
        <CardBoxComponentEmpty message="No ideas available to display." />
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
