import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { superAdminAPI } from "../api";
import { setGlobalSettings } from "../redux/userSlice";

const useGetSettings = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await superAdminAPI.getSettings();
        if (res.data) {
          dispatch(setGlobalSettings(res.data));
        }
      } catch (err) {
        console.error("Error fetching global settings:", err);
        // If backend is not updated (404), we just keep the default/local storage settings
        // which are already handled by the initial state in userSlice.js
      }
    };

    fetchSettings();
  }, [dispatch]);
};

export default useGetSettings;
