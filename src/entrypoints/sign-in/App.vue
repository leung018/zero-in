<template>
  <div class="signin-container">
    <h2 class="mb-4">Sign in to Zero In</h2>

    <div class="message-box">
      <p>
        Sign in and get premium features! I'm offering a free trial during an ongoing promotion.
        <br /><br />Remember, this trial is active but could end at any moment.
      </p>
    </div>

    <button class="btn btn-google">Sign in with Google</button>

    <p class="mt-4 text-muted" style="font-size: 0.85em">
      By signing in, you agree to the
      <a href="#" class="text-decoration-none">Terms of Service</a> and
      <a href="#" class="text-decoration-none">Privacy Policy</a>.
    </p>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.signin-container {
  font-family: 'Roboto', sans-serif; /* You might need to import Roboto font globally or via CSS */
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 430px;
  margin: 40px auto;
  text-align: center;
}

body {
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.btn-google {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  display: block;
  width: 100%;
  margin-top: 20px;
  transition: background-color 0.2s ease-in-out;
}
.btn-google:hover {
  background-color: #357ae8;
}

.message-box {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 5px;
  padding: 15px;
  margin-top: 25px;
  font-size: 0.95em;
  color: #364f6b;
  text-align: left;
}
.message-box strong {
  color: #1890ff;
}
</style>
