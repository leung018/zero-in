<script setup lang="ts"></script>

<template>
  <div class="container">
    <h1 class="mt-5 mb-4">
      Warning: For development testing only. If you accidentally navigate to this page, please close
      this tab
    </h1>
    <form>
      <b-form-group label="Focus Duration (seconds)" data-test="focus-duration">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Short Break Duration (seconds)" data-test="short-break-duration">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Long Break Duration (seconds)" data-test="long-break-duration">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Number of Pomodori Per Cycle" data-test="num-of-pomodori-per-cycle">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Record Housekeeping Days" data-test="record-housekeeping-days">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <div class="mt-4">
        <b-button variant="danger" type="button" class="me-2" data-test="save-button"
          >Save</b-button
        >
        <b-button variant="success" type="button">Reset to Default</b-button>
      </div>
    </form>
  </div>
</template>
