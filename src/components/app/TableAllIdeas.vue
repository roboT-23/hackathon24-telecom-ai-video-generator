<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '@/stores/main'
import { mdiEye, mdiTrashCan } from '@mdi/js'
import CardBoxModal from '@/components/CardBoxModal.vue'
import TableCheckboxCell from '@/components/TableCheckboxCell.vue'
import BaseLevel from '@/components/BaseLevel.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import BaseButton from '@/components/BaseButton.vue'

const props = defineProps({
  checkable: Boolean,
  ideas: {
    type: Array,
    default: () => []
  },
  loading: Boolean,
  error: String
})

const isModalActive = ref(false)
const isModalDangerActive = ref(false)
const selectedIdea = ref(null)

const perPage = ref(5)
const currentPage = ref(0)
const checkedRows = ref([])

const itemsPaginated = computed(() =>
  props.ideas.slice(perPage.value * currentPage.value, perPage.value * (currentPage.value + 1))
)

const numPages = computed(() => Math.ceil(props.ideas.length / perPage.value))
const currentPageHuman = computed(() => currentPage.value + 1)
const pagesList = computed(() => {
  const pagesList = []
  for (let i = 0; i < numPages.value; i++) {
    pagesList.push(i)
  }
  return pagesList
})

const remove = (arr, cb) => {
  const newArr = []
  arr.forEach((item) => {
    if (!cb(item)) {
      newArr.push(item)
    }
  })
  return newArr
}

const checked = (isChecked, idea) => {
  if (isChecked) {
    checkedRows.value.push(idea)
  } else {
    checkedRows.value = remove(checkedRows.value, (row) => row.id === idea.id)
  }
}

const openIdeaModal = (idea) => {
  selectedIdea.value = idea
  isModalActive.value = true
}

const confirmDelete = (idea) => {
  selectedIdea.value = idea
  isModalDangerActive.value = true
}
</script>

<template>
  <CardBoxModal v-model="isModalActive" :title="selectedIdea?.name || 'Idea Details'">
    <div v-if="selectedIdea">
      <p><b>Name:</b> {{ selectedIdea.name }}</p>
      <p><b>Description:</b> {{ selectedIdea.description }}</p>
      <p><b>Type:</b> {{ selectedIdea.type }}</p>
      <p><b>Status:</b> {{ selectedIdea.status }}</p>
      <p><b>Created At:</b> {{ new Date(selectedIdea.created_at).toLocaleDateString() }}</p>
    </div>
  </CardBoxModal>

  <CardBoxModal
    v-model="isModalDangerActive"
    title="Confirm Delete"
    button="danger"
    has-cancel
  >
    <p>Are you sure you want to delete the idea "{{ selectedIdea?.name }}"?</p>
    <p>This action cannot be undone.</p>
  </CardBoxModal>

  <div v-if="loading" class="p-4 text-center">Loading ideas...</div>
  <div v-else-if="error" class="p-4 text-red-500">{{ error }}</div>
  <template v-else>
    <table>
      <thead>
      <tr>
        <th v-if="checkable" />
        <th>Name</th>
        <th>Type</th>
        <th>Status</th>
        <th>Created At</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="idea in itemsPaginated" :key="idea.id">
        <TableCheckboxCell v-if="checkable" @checked="checked($event, idea)" />
        <td data-label="Name">{{ idea.name }}</td>
        <td data-label="Type">{{ idea.type }}</td>
        <td data-label="Status">
          <span :class="{
            'text-green-500': idea.status === 'completed',
            'text-yellow-500': idea.status === 'in progress',
            'text-red-500': idea.status === 'pending'
          }">
            {{ idea.status }}
          </span>
        </td>
        <td data-label="Created At">
          <small class="text-gray-500 dark:text-slate-400">
            {{ new Date(idea.created_at).toLocaleDateString() }}
          </small>
        </td>
        <td class="before:hidden lg:w-1 whitespace-nowrap">
          <BaseButtons type="justify-start lg:justify-end" no-wrap>
            <BaseButton
              color="info"
              :icon="mdiEye"
              small
              @click="openIdeaModal(idea)"
            />
            <BaseButton
              color="danger"
              :icon="mdiTrashCan"
              small
              @click="confirmDelete(idea)"
            />
          </BaseButtons>
        </td>
      </tr>
      </tbody>
    </table>
    <div v-if="numPages > 1" class="p-3 lg:px-6 border-t border-gray-100 dark:border-slate-800">
      <BaseLevel>
        <BaseButtons>
          <BaseButton
            v-for="page in pagesList"
            :key="page"
            :active="page === currentPage"
            :label="page + 1"
            :color="page === currentPage ? 'lightDark' : 'whiteDark'"
            small
            @click="currentPage = page"
          />
        </BaseButtons>
        <small>Page {{ currentPageHuman }} of {{ numPages }}</small>
      </BaseLevel>
    </div>
  </template>
</template>
