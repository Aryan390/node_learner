import axios from "axios"
import { showAlert } from "./alerts"

const publicApiKey = 'pk_test_51K2uP4SD3g6LuimUJXJKkuqFSRcijqVgvNQpjNo8fIdykFAm8BIGSPUmD06wqeW7mTKp2Gzkv726l2GbXxKl6Xs700XdQptFLV'

const stripe = Stripe(publicApiKey)

export const bookTour = async tourId => {
  try{
    // 1) Get checkout session from api
    const session =  await axios(`http://localhost:3000/api/v1/bookings/ckeckout-session/${tourId}`)    
    console.log(session);

    // 2) create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
    
  }catch(err) {
    console.log(err);
    console.log('fromom error block');
    showAlert('error', err);
  }


}