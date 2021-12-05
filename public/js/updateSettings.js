import axios from 'axios'
import { showAlert } from './alerts'

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try{
    const url = type === 'password' 
    ? 'http://localhost:3000/api/v1/users/updateMyPassword' 
    : 'http://localhost:3000/api/v1/users/updateMe'

    const res = await axios({
      method: 'PATCH',
      url,
      // data: {
      //   name,
      //   email
      // }
      data
    })

    console.log(res.data);

    if(res.data.status === 'Success'){
      showAlert('success', `${type.toUpperCase()} updated successfully`)
    }

  }catch(err) {
    showAlert('error', err.response.data.message)
  }
  console.log('somethinis is fishy');
}