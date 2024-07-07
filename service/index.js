const Contact = require("./schemas/contact");

const getAllContacts = (userId) => {
  return Contact.find({ owner: userId });
};

const getContactById = (userId, id) => {
  return Contact.findOne({ _id: id, owner: userId });
};

const createContact = (userId, { name, email, phone }) => {
  return Contact.create({ name, email, phone, owner: userId });
};

const updateContact = (userId, id, fields) => {
  return Contact.findOneAndUpdate({ _id: id, owner: userId }, fields, {
    new: true,
    runValidators: true,
  });
};

const removeContact = (userId, id) => {
  return Contact.findOneAndDelete({ _id: id, owner: userId });
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  removeContact,
};
