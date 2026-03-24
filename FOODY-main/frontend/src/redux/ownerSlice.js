import { createSlice } from "@reduxjs/toolkit";

const ownerSlice=createSlice({
    name:"owner",
    initialState:{
        myShopData:null,
        activeTab: 'dashboard'
    },
    reducers:{
        setMyShopData:(state,action)=>{
            state.myShopData=action.payload
        },
        setActiveTab: (state, action) => {
            state.activeTab = action.payload
        }
    }
})

export const {setMyShopData, setActiveTab}=ownerSlice.actions
export default ownerSlice.reducer