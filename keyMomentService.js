import api from './api';


export const getKeyMoments = async (videoId) => {
  const response = await api.get(`/api/videos/${videoId}/key-moments/`);
  return response.data;
};

export const detectKeyMoments = async (videoId) => {
  const response = await api.post(`/api/videos/${videoId}/key-moments/detect`);
  return response.data;
};

export const checkVideoStatus = async (videoId) => {
  const response = await api.get(`/api/videos/${videoId}`);
  return response.data;
};

export const createKeyMoment = async (videoId, data) => {
  const response = await api.post(`/api/videos/${videoId}/key-moments/`, data);
  return response.data;
};

export const updateKeyMoment = async (videoId, momentId, data) => {
  const response = await api.put(`/api/videos/${videoId}/key-moments/${momentId}`, data);
  return response.data;
};

export const deleteKeyMoment = async (videoId, momentId) => {
  await api.delete(`/api/videos/${videoId}/key-moments/${momentId}`);
};

