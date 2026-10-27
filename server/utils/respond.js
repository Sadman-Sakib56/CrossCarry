// সব error response একই ধরনের হবে: { code, message }
// client এই `code` দিয়ে বাংলা/English message বেছে নেয়, তাই code গুলো stable রাখা জরুরি
export const fail = (res, status, code, message) =>
  res.status(status).json({ code, message });

export const serverError = (res, error) => {
  console.error(error);
  return res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong on our side' });
};
