import { json, unauthorized, userFor } from '../lib/http';

export const onRequestGet = async context => {
  const user = await userFor(context);

  return user ? json({ user }) : unauthorized();
};
