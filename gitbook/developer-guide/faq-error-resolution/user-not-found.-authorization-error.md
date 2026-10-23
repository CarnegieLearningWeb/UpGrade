# User not found. Authorization error

## Problem

`User not found. Authorization error`

## **Solution**

Change `.env` file in backend code:

&#x20;`AUTH_CHECK`=true to `AUTH_CHECK`=false  (this will disable server-side auth)
