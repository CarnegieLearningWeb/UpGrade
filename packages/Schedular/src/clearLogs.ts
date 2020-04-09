import 'source-map-support/register';
import fetch from 'node-fetch';
import * as jwt from 'jsonwebtoken';

export const clearLogs = async event => {
    try {
        console.log('Event data ', event.body);
        const { logTypes } = event.body; // Extract logTypes
        const token = jwt.sign({ logTypes }, process.env.TOKEN_SECRET_KEY, { expiresIn: 120 }); //Toke will expires in 2 minutes
        await fetch(event.url, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ logTypes })
        }).catch(error => {
            console.log('Error in clear logs schedular endpoint invocation ', error.message);
            return { status: false, message: 'Failed' };
        });
        return { status: true, message: 'Success' };
    } catch (error) {
        console.log('Error ocurred in clear logs lambda', error.message);
        return { status: false, message: 'Failed' };
    }
};
