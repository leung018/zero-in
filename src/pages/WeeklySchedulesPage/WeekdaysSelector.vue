<script setup lang="ts">
import { Weekday } from '../../domain/schedules'
import { capitalized } from '../../util'

const weekdaySet = defineModel<Set<Weekday>>({
  required: true
})

const onChangeWeekday = (weekday: Weekday) => {
  if (weekdaySet.value.has(weekday)) {
    weekdaySet.value.delete(weekday)
  } else {
    weekdaySet.value.add(weekday)
  }
}

const weekdays: Weekday[] = Object.values(Weekday).filter((v) => typeof v === 'number') as Weekday[]
</script>

<template>
  <div>
    <div :key="weekday" v-for="weekday in weekdays" class="form-check form-check-inline">
      <input
        class="form-check-input"
        type="checkbox"
        :data-test="`check-weekday-${Weekday[weekday].toLowerCase()}`"
        :value="weekday"
        @change="onChangeWeekday(weekday)"
        :checked="weekdaySet.has(weekday)"
      />
      <label class="form-check-label" data-test="weekday-label">{{
        capitalized(Weekday[weekday])
      }}</label>
    </div>
  </div>
</template>
