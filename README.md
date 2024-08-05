# Toolkit

This is the Master Branch for the eMate - Toolkit Project [Backend].
Checkout to the development branch for the latest code

## Description

eMate - Toolkit Project, built upon Node JS, Express Js, MongoDB, Mongoose.

## Installation

```bash
$ npm install
$ npm install --dev
```

## Run Migration

```bash
$ npm install migrate-mongo
$ migrate-mongo up
```

## Running the app

```bash
# development
$ npm start

# watch mode
$ npm run local-start

# production mode
$ npm start:prod
```

## API Doc
[Postman Url](https://documenter.getpostman.com/view/10282747/Uz5NkDvw#794899ca-feb9-4437-a80d-7f55b0e918e2)

# Instructions
## Need to upload excel files to the system
```
login using admin user_name and password
go to upload files
need to upload all file with same file name as original file have.

all files available in "Emate Standard Upload Files"(From Drive)
```

## Need to create organization
```
/admin/organization - use this route to create organization

- to create organization pass admin JWT token to the headers
- login to db and go to excel_data collection
    check fileName having "Products" and "States".
    Copy fileId and pass it to the create organization api request parameters
    Select and copy one/two ids from "Products" and "States" files from "fileData" field and add it to the "value"
```

# Project Team
## Project Manager & Lead
```
Nikita Solanki
Harikrushna Jadav
```

## Developer
```
Sagar Chauhan
Chandan Chhajer
```