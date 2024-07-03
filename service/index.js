const Contact = require("./schemas/contact");

const getAllContacts = () => {
  return Contact.find();
};

const getContactById = (id) => {
  return Contact.findById(id);
};

const createContact = ({ name, email, phone }) => {
  return Contact.create({ name, email, phone });
};

const updateContact = (id, fields) => {
  return Contact.findByIdAndUpdate(id, fields, {
    new: true,
    runValidators: true,
  });
};

const removeContact = (id) => {
  return Contact.findByIdAndDelete(id);
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  removeContact,
};
