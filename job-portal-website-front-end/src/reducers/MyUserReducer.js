const MyUserReducer = (currentState, action) => {
  switch (action.type) {
    case "LOGIN":
      return action.payload;
    case "LOGOUT":
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    default:
      return currentState;
  }
};

export default MyUserReducer;
