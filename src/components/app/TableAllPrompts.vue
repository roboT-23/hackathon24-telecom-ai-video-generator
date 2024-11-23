<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '@/stores/main'
import { mdiEye, mdiTrashCan } from '@mdi/js'
import CardBoxModal from '@/components/CardBoxModal.vue'
import TableCheckboxCell from '@/components/TableCheckboxCell.vue'
import BaseLevel from '@/components/BaseLevel.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import BaseButton from '@/components/BaseButton.vue'
import { mdiHeart, mdiHeartOutline } from '@mdi/js'
import { marked } from 'marked'

const props = defineProps({
  checkable: Boolean,
  prompts: {
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
  props.prompts.slice(perPage.value * currentPage.value, perPage.value * (currentPage.value + 1))
)

const numPages = computed(() => Math.ceil(props.prompts.length / perPage.value))
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

const checked = (isChecked, prompt) => {
  if (isChecked) {
    checkedRows.value.push(prompt)
  } else {
    checkedRows.value = remove(checkedRows.value, (row) => row.id === prompt.id)
  }
}

const openIdeaModal = (prompt) => {
  selectedIdea.value = prompt
  isModalActive.value = true
}

const confirmDelete = (prompt) => {
  selectedIdea.value = prompt
  isModalDangerActive.value = true
}
</script>

<template>
  <CardBoxModal  v-model="isModalActive" :title="selectedIdea?.name || 'Idea Details'">
    <div class="flex-auto overflow-auto" v-if="selectedIdea">
      <p><b>Name:</b> {{ selectedIdea.name }}</p>
      <p><b>Description:</b> {{ selectedIdea.description }}</p>
      <p><b>Type:</b> {{ selectedIdea.type }}</p>
      <p><b>Status:</b> {{ selectedIdea.status }}</p>
      <p><b>Created At:</b> {{ new Date(selectedIdea.created_at).toLocaleDateString() }}</p>
      <hr><hr>
      <h3 class="text-lg font-semibold mb-4">The prompt:</h3>
      <hr>
      <br>
      <div v-html="marked(selectedIdea.content)"></div>
<!--      <div v-html="selectedIdea.content"></div>-->
    </div>
  </CardBoxModal>

  <CardBoxModal
    v-model="isModalDangerActive"
    title="Confirm Delete"
    button="danger"
    has-cancel
  >
    <p>Are you sure you want to delete the prompt "{{ selectedIdea?.name }}"?</p>
    <p>This action cannot be undone.</p>
  </CardBoxModal>

  <div v-if="loading" class="p-4 text-center">Loading prompts...</div>
  <div v-else-if="error" class="p-4 text-red-500">{{ error }}</div>
  <template v-else>
    <table>
      <thead>
      <tr>
        <th v-if="checkable" />
        <th>Name</th>
        <th>Type</th>
        <th>Language</th>
        <th>Created At</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="prompt in itemsPaginated" :key="prompt.id">
        <TableCheckboxCell v-if="checkable" @checked="checked($event, prompt)" />
        <td data-label="Name">{{ prompt.name }}</td>
        <td data-label="Type">{{ prompt.type }}</td>
        <td data-label="Language">
          <small class="text-gray-500 dark:text-slate-400">
            {{ prompt.language }}
          </small>
        </td>
        <td data-label="Created At">
          <small class="text-gray-500 dark:text-slate-400">
            {{ new Date(prompt.created_at).toLocaleDateString() }}
          </small>
        </td>
        <td class="before:hidden lg:w-1 whitespace-nowrap">
          <BaseButtons type="justify-start lg:justify-end" no-wrap>
            <BaseButton
              color="info"
              :icon="mdiEye"
              small
              @click="openIdeaModal(prompt)"
            />
            <BaseButton
              color="danger"
              :icon="mdiTrashCan"
              small
              @click="confirmDelete(prompt)"
            />
          </BaseButtons>
<!--          <BaseButton-->
<!--            v-if="prompt.liked"-->
<!--            color="danger"-->
<!--            :icon="mdiHeart"-->
<!--            small-->
<!--          />-->
<!--          <BaseButton-->
<!--            v-else-->
<!--            color="info"-->
<!--            :icon="mdiHeartOutline"-->
<!--            small-->
<!--          />-->
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
