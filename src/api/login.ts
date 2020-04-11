import { Endpoint } from "./endpoint";

type NoQuery = undefined;

const login = new Endpoint<NoQuery>(3, "profiles/sessions");

export { login };
