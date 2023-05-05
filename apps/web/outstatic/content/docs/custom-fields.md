---
title: 'Custom Fields'
status: 'draft'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'custom-fields'
description: ''
coverImage: ''
publishedAt: '2022-11-09T21:01:41.557Z'
---

## Custom fields

If you're looking to add some extra data to your content in a more structured way, then you're in the right place! Outstatic has an awesome feature called custom fields that makes it super easy to do just that.

## Steps to add custom fields:

### Step 1: Access the Add Custom Fields Page

First, head over to the Collections page and click on the Collection you want to add custom fields to.

### Step 2: Create a new Custom Field

Once you've selected your Collection, click the Add Custom Field button. This will bring up a modal with a few options for you to fill out.

Field Name:
Enter the name of your custom field in the "Field Name" section. This will be the name of the field that appears on your Document.

Field Type:
Choose the data type that you would like the custom field to be in the "Field Type" section. For example, you might choose "string".

Description:
You can add a brief description of the field in the "Description" field. This is a good place to provide context for the field and explain how it should be used.

Required Field:
If you want to make the custom field mandatory, select the "Required Field" checkbox. If someone tries to save a document without filling in this custom field, they will be prompted to enter data into this field before the document can be saved.

This field will be accessible on the frontend as:
Outstatic will generate a camel case id based on the field name. This is how the field will be stored in your Markdown files and you should use this id to fetch data from the frontend. Check out the Fetching data section of the docs to learn more.

Step 5: Save the custom field
Finally, save your new custom field by clicking the "Add" button in the custom fields interface. Once saved, the custom fields will be available for use on the selected collection documents.

Editing and deleting custom fields is also super easy. Just click on the field you want to edit, make your changes, and hit save. To delete a field, simply click the delete button next to the field you want to remove.

## Good to know

Fields are Collection specific, that means if you have two Collections with the same field name, you will have to fetch them separately.

## Conclusion

Overall, custom fields are an awesome way to extend your content with additional structured data. By following these steps, you'll be able to create custom fields and start using them in no time!
