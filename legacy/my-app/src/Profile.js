import React, {useContext, useState} from 'react';
import './Profile.css';
import { loginContext } from './Context/loginContext';
import axios from 'axios'

function Profile() { 

    let [currentuser,error,userLoginStatus,loginuser] = useContext(loginContext)
    let [err,setErr] = useState("")
    let [data,setData] = useState("")
    
    // get data form protected route
    const getProtectedData=()=>{
        let token=localStorage.getItem("token")

        axios
        .get("http://localhost:3500/user-api/test",{headers:{"Authorization":"Bearer"+token}})
        .then(response)
        .catch(err=>{
            setErr(err.message)
        })
    }

    return (
        // Hi, {currentuser.username}
        <div>
            <p className="display-4 text-end text-primary">Welcome, {currentuser.username}</p>
            <button onclick={handleLogout}></button>
            <button className="btn btn-danger mx-auto" onClick={getProtectedData}>
                Get Protected Data
            </button>
            {
                /*Add products and cart list
                */
            }
        </div>
    )
}

export default Profile
