import axios from 'axios'
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try{
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    })

    console.log('dont know yety')

    if(res.data.status === 'Success'){
      console.log('sucess aryan')
      showAlert('success','logged in successfully');
      window.setTimeout(() => {
        location.assign('/')
      }, 1500)
    }

    console.log(res);
  }catch(err){
    showAlert('error',err.response.data.message)
  }
}

export const logout = async () => {
  try{
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout'
    })

    // location.reload(true) will force a reload from the server and not from browser cache
    // this is important because it might simply load the same page with user menu from the cache, but we want a fresh page coming in from the server
    if(res.data.status === 'success') location.reload(true)
  }catch(err){
    showAlert('error', 'Error logging out! Try again.')
  }
}