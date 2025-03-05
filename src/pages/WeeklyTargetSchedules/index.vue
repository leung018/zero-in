<script setup lang="ts">
import type { Weekday } from '@/domain/schedules'
import { Time } from '../../domain/schedules/time'
import { ref } from 'vue'
import TimeInput from '../WeeklySchedulesPage/TimeInput.vue'
import WeekdaysSelector from '../WeeklySchedulesPage/WeekdaysSelector.vue'
import { BFormGroup, BListGroup, BListGroupItem } from 'bootstrap-vue-next'

const newStartTime = ref<Time>(new Time(0, 0))
const newWeekdaySet = ref<Set<Weekday>>(new Set())
</script>

<template>
  <div class="container">
    <h1 class="mb-4 mt-4">Target Schedules</h1>
    <form>
      <div class="mb-4">
        <div class="form-group">
          <label>Select Weekdays:</label>
          <WeekdaysSelector class="d-flex flex-wrap" v-model="newWeekdaySet" />
        </div>

        <div class="form-group">
          <label>Start Time:</label>
          <TimeInput
            class="d-flex"
            v-model="newStartTime"
            hour-input-data-test="start-time-hour-input"
            minute-input-data-test="start-time-minute-input"
          />
        </div>

        <BFormGroup label="Target Pomodori:">
          <BFormInput style="width: 5rem" type="number"></BFormInput>
        </BFormGroup>
      </div>
      <BButton variant="primary" data-test="add-button">Add</BButton>
    </form>
    <div class="mt-4">
      <h3>Saved</h3>
      <BListGroup>
        <BListGroupItem class="d-flex justify-content-between align-items-center">
          <div>
            Sun, Mon
            <br />
            16:00
            <br /><br />
            Target Pomodori: 4
          </div>
          <button class="btn text-danger bg-transparent border-0">X</button>
        </BListGroupItem>
        <BListGroupItem class="d-flex justify-content-between align-items-center">
          <div>
            Sun, Mon
            <br />
            16:00
            <br /><br />
            Target Pomodori: 4
          </div>
          <BButton class="text-danger bg-transparent border-0">X</BButton>
        </BListGroupItem>
      </BListGroup>
    </div>
  </div>
</template>
