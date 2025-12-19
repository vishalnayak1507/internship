import axios from "axios"
const axiosClient  = axios.create({
    baseURL : import.meta.env.VITE_BASE_URI,
    withCredentials : true //important as this sends cookies by default
})
export default axiosClient