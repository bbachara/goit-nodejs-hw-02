const Contact = require("./schemas/contact");

const getAllContacts = async () => {
  return await Contact.find({});
};

const getContactById = async (id) => {
  return await Contact.findById(id);
};

const createContact = async (contactData) => {
  const contact = new Contact(contactData);
  return await contact.save();
};

const updateContact = async (id, updateData) => {
  return await Contact.findByIdAndUpdate(id, updateData, { new: true });
};

const removeContact = async (id) => {
  return await Contact.findByIdAndDelete(id);
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  removeContact,
};
