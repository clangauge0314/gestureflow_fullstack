import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    userToken: null,
    logged: false,
    meetingIDs: [], 
  },
  reducers: {
    setUserToken: (state, action) => {
      state.userToken = action.payload;
      state.logged = !!action.payload;
    },
    clearUserToken: (state) => {
      state.userToken = null;
      state.logged = false;
    },
    setMeetingIDs: (state, action) => {
      state.meetingIDs = action.payload; 
    },
    clearMeetingIDs: (state) => {
      state.meetingIDs = []; 
    },
  },
});

export const { setUserToken, clearUserToken, setMeetingIDs, clearMeetingIDs } = userSlice.actions;

export default userSlice.reducer;
