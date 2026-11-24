# Relation ‘experiment\_condition’ already exists

## **Problem**

Backend won't start due to: `Relation ‘experiment_condition’ already exists`

## Solution(s)

Your Postgres server needs to be deleted and a new one is to be created. If you still have an issue then check the database on datagrip and if you still see tables present, drop the public schema `tables` and the `object types` and `sequences` folders in public.

![](<../../.gitbook/assets/Screenshot 2021-09-25 at 11.24.15 AM.png>)

**OR**

Set `TYPEORM_SYNCHRONIZE` variable of `.env` file to **true** while in the main branch and then start backend server, so you have the current base schema populated with you, then close the server. Now, switch to your branch that has schema changes and starts the server, and set `TYPEORM_SYNCHRONIZE` variable of `.env` file to **false** and run migration script to get the migration file generated.
