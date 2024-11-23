<script setup>
import { mdiMonitorCellphone, mdiTableBorder, mdiTableOff, mdiGithub, mdiPlus, mdiRefresh } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CardBox from '@/components/CardBox.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import BaseButton from '@/components/BaseButton.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import TableAllVideos from '@/components/app/TableAllVideos.vue'

import { ref, onMounted } from 'vue'
import axios from 'axios'

const videos = ref([])
const loading = ref(true)
const error = ref(null)

const fetchVideos = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/videos')
    videos.value = response.data
    loading.value = false
  } catch (err) {
    error.value = 'Failed to fetch videos'
    loading.value = false
    console.error('Error fetching videos:', err)
  }
}

onMounted(() => {
  fetchVideos()
})
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiTableBorder" title="Video Library" main>
        <BaseButton
          :icon="mdiPlus"
          label="Upload Video"
          color="contrast"
          rounded-full
          small
        />
        <BaseButton
          label="Refresh"
          :icon="mdiRefresh"
          color="contrast"
          rounded-full
          small
          @click="fetchVideos"
        />
      </SectionTitleLineWithButton>

<!--      <NotificationBar color="info" :icon="mdiMonitorCellphone">-->
<!--        <b>Video Management.</b> View and manage your video content-->
<!--      </NotificationBar>-->

      <CardBox class="mb-6" has-table>
        <TableAllVideos
          :videos="videos"
          :loading="loading"
          :error="error"
          checkable
        />
      </CardBox>

      <CardBox v-if="!loading && !error && !videos.length">
        <CardBoxComponentEmpty />
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
