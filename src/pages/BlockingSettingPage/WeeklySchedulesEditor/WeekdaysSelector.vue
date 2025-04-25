<script setup lang="ts">
import { computed } from 'vue'
import { Weekday } from '@/domain/schedules'
import { capitalized } from '@/utils/format'

const weekdaySet = defineModel<Set<Weekday>>({
  required: true
})

const weekdayList = computed({
  get: () => Array.from(weekdaySet.value),
  set: (value: Weekday[]) => (weekdaySet.value = new Set(value))
})

const WEEKDAYS: Weekday[] = Object.values(Weekday).filter((v) => typeof v === 'number') as Weekday[]
</script>

<template>
  <div>
    <BFormCheckboxGroup v-model="weekdayList">
      <BFormCheckbox
        v-for="weekday in WEEKDAYS"
        :key="weekday"
        :value="weekday"
        :data-test="`check-weekday-${Weekday[weekday].toLowerCase()}`"
      >
        <label class="form-check-label" data-test="weekday-label">
          {{ capitalized(Weekday[weekday]) }}
        </label>
      </BFormCheckbox>
    </BFormCheckboxGroup>
  </div>
</template>
