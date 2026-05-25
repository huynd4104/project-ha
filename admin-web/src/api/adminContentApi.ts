import { httpClient } from "./httpClient";

export const adminContentApi = {
  async list(resourceName: string) {
    const res = await httpClient.get(`/api/admin/${resourceName}`);
    return res.data;
  },
  async create(resourceName: string, data: any) {
    const res = await httpClient.post(`/api/admin/${resourceName}`, data);
    return res.data;
  },
  async update(resourceName: string, id: string, data: any) {
    const res = await httpClient.put(`/api/admin/${resourceName}/${id}`, data);
    return res.data;
  },
  async remove(resourceName: string, id: string) {
    const res = await httpClient.delete(`/api/admin/${resourceName}/${id}`);
    return res.data;
  }
};
