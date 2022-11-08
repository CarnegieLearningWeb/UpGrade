import 'source-map-support/register';
import fetch from 'node-fetch';
import * as jwt from 'jsonwebtoken';

export const schedule = async (event) => {
  try {
    console.log('Event data ', event);
    const token = jwt.sign(event.body, process.env.TOKEN_SECRET_KEY, { expiresIn: 120 }); //Toke will expires in 2 minutes
    await fetch(event.url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event.body),
    }).catch((error) => {
      console.log('Error in scheduler endpoint invocation ', error.message);
      return { status: false, message: 'Failed' };
    });
    return { status: true, message: 'Success' };
  } catch (error) {
    console.log('Error ocurred in schedule lambda', error.message);
    return { status: false, message: 'Failed' };
  }
};
