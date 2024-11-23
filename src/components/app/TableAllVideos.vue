<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '@/stores/main'
import { mdiEye, mdiTrashCan } from '@mdi/js'
import CardBoxModal from '@/components/CardBoxModal.vue'
import TableCheckboxCell from '@/components/TableCheckboxCell.vue'
import BaseLevel from '@/components/BaseLevel.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import BaseButton from '@/components/BaseButton.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const props = defineProps({
  checkable: Boolean,
  videos: {
    type: Array,
    default: () => []
  },
  loading: Boolean,
  error: String
})

const isModalActive = ref(false)
const isModalDangerActive = ref(false)
const selectedVideo = ref(null)

const perPage = ref(5)
const currentPage = ref(0)
const checkedRows = ref([])

const itemsPaginated = computed(() =>
  props.videos.slice(perPage.value * currentPage.value, perPage.value * (currentPage.value + 1))
)

const numPages = computed(() => Math.ceil(props.videos.length / perPage.value))
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

const checked = (isChecked, video) => {
  if (isChecked) {
    checkedRows.value.push(video)
  } else {
    checkedRows.value = remove(checkedRows.value, (row) => row.id === video.id)
  }
}

const openVideoModal = (video) => {
  selectedVideo.value = video
  isModalActive.value = true
}

const confirmDelete = (video) => {
  selectedVideo.value = video
  isModalDangerActive.value = true
}
</script>

<template>
  <CardBoxModal v-model="isModalActive" :title="selectedVideo?.title || 'Video Details'">
    <div v-if="selectedVideo">
      <p><b>Title:</b> {{ selectedVideo.title }}</p>
      <p><b>Duration:</b> {{ selectedVideo.duration }}</p>
      <p><b>Upload Date:</b> {{ new Date(selectedVideo.created_at).toLocaleDateString() }}</p>
      <p><b>Description:</b> {{ selectedVideo.description }}</p>
    </div>
  </CardBoxModal>

  <CardBoxModal
    v-model="isModalDangerActive"
    title="Confirm Delete"
    button="danger"
    has-cancel
  >
    <p>Are you sure you want to delete video "{{ selectedVideo?.title }}"?</p>
    <p>This action cannot be undone.</p>
  </CardBoxModal>

  <div v-if="loading" class="p-4 text-center">Loading videos...</div>
  <div v-else-if="error" class="p-4 text-red-500">{{ error }}</div>
  <template v-else>
    <table>
      <thead>
      <tr>
        <th v-if="checkable" />
        <th>Thumbnail</th>
        <th>Title</th>
        <th>Duration</th>
        <th>Upload Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="video in itemsPaginated" :key="video.id">
        <TableCheckboxCell v-if="checkable" @checked="checked($event, video)" />
        <td class="border-b-0 lg:w-6 before:hidden">
          <img
            :src="video.thumbnail_url || '/api/placeholder/120/80'"
            :alt="video.title"
            class="w-24 h-16 object-cover mx-auto lg:w-12 lg:h-8"
          />
        </td>
        <td data-label="Title">{{ video.title }}</td>
        <td data-label="Duration">{{ video.duration }}</td>
        <td data-label="Upload Date">
          <small class="text-gray-500 dark:text-slate-400">
            {{ new Date(video.created_at).toLocaleDateString() }}
          </small>
        </td>
        <td data-label="Status">
            <span :class="{
              'text-green-500': video.status === 'active',
              'text-yellow-500': video.status === 'processing',
              'text-red-500': video.status === 'error'
            }">
              {{ video.status }}
            </span>
        </td>
        <td class="before:hidden lg:w-1 whitespace-nowrap">
          <BaseButtons type="justify-start lg:justify-end" no-wrap>
            <BaseButton
              color="info"
              :icon="mdiEye"
              small
              @click="openVideoModal(video)"
            />
            <BaseButton
              color="danger"
              :icon="mdiTrashCan"
              small
              @click="confirmDelete(video)"
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
