<script setup lang="ts"></script>

<template>
  <div class="container">
    <h1 class="mt-5 mb-4">
      Warning: For development testing only. If you accidentally navigate to this page, please close
      this tab
    </h1>
    <form>
      <b-form-group label="Focus Duration (seconds)">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Short Break Duration (seconds)">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Long Break Duration (seconds)">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Pomodori Per Cycle">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <b-form-group label="Record Housekeeping Days">
        <b-form-input type="number" min="1"></b-form-input>
      </b-form-group>
      <div class="mt-4">
        <b-button variant="danger" type="button" class="me-2">Save</b-button>
        <b-button variant="success" type="button">Reset</b-button>
      </div>
    </form>
  </div>
</template>
