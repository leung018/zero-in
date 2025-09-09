<script setup lang="ts"></script>

<template>
  <div class="signin-container processing-message">
    <div class="spinner-border text-primary mb-3"></div>
    <h4 class="mb-2">Signing you in...</h4>
    <p class="text-muted">
      Please don't close this page. We're securely connecting your account now.
    </p>
  </div>
</template>

<style scoped>
.processing-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 50px;
}

.spinner-border {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  vertical-align: -0.125em;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  -webkit-animation: 0.75s linear infinite spinner-border;
  animation: 0.75s linear infinite spinner-border;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
