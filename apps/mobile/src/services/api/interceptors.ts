import axios from "axios";
  import * as SecureStore from "expo-secure-store";
  import { apiClient } from "./client";

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await SecureStore.getItemAsync("refresh_token");

          if (!refreshToken) {
            return Promise.reject(error);
          }

          const res = await axios.post("/v1/auth/refresh", { refreshToken });

          const { accessToken } = res.data;

          await SecureStore.setItemAsync("access_token", accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
  