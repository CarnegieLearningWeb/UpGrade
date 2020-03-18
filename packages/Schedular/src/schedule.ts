import 'source-map-support/register';
import request from 'request-promise';

export const schedule = async event => {
  try {
    console.log('Event data ', event);
    const scheduleId = event.body.id;
    await request.post({
      url: event.url,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: scheduleId })
    }).catch(error => {
      console.log('Error in schedular endpoint invocation ', error.message);
      return { status: false, message: 'Failed' };
    });
    return { status: true, message: 'Success' };
  } catch (error) {
    console.log('Error ocurred in schedule lambda', error.message);
    return { status: false, message: 'Failed' };
  }
};
