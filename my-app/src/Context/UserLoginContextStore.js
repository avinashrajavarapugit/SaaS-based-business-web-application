import React ,{useState}from 'react';
import { loginContext } from './loginContext';
import axios from 'axios'
function UserLoginContextStore({children}) {

    let [currentuser,setCurrentUser] = useState({});
    let [error,setError] = useState("");
    let [userLoginStatus,setuserLoginStatus] = useState(false)


    //user login
    const loginuser=(userCredObj)=>{
        axios.post('http://localhost:4000/user-api/user-login',userCredObj)
        .then(response=>{
            if(response.data.message==="success"){
                //update current user state
                setCurrentUser({...response.data.user})
                //update user login status
                setuserLoginStatus(true)
                //update error status
                setError("")
                //store jwt in local or session storage
                localStorage.setItem("token",response.data.token) 
            }else{
                setError(response.data.message)
            }
        })
        .catch(err=>{

        })
    }
    //user logout
    const logoutUser=()=>{
        //clear local or session storae
        localStorage.clear();
        setuserLoginStatus(false)

    }

    return (
        <loginContext.Provider value={[currentuser,error,userLoginStatus,loginuser,logoutUser]}>
            {children}
        </loginContext.Provider>
    )
}

export default UserLoginContextStore