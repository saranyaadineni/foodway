import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setShopsInMyCity } from "../redux/userSlice";
import api from "../api";

const normalize = (val = "") =>
  val.toString().trim().toLowerCase();

function useGetShopByCity() {
  const dispatch = useDispatch();
  const { currentCity, userData } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        let cityParam = "all";

        if (
          userData?.role !== "superadmin" &&
          userData?.role !== "owner"
        ) {
          cityParam = currentCity
            ? normalize(currentCity)
            : "all";
        }

        const res = await api.get(
          `/api/shop/get-by-city/${cityParam}`
        );

        dispatch(setShopsInMyCity(res.data || []));
      } catch (error) {
        console.error(
          "❌ Fetch shops error:",
          error.response?.data || error.message
        );
        dispatch(setShopsInMyCity([]));
      }
    };

    fetchShops();
  }, [currentCity, userData?.role, dispatch]);
}

export default useGetShopByCity;
