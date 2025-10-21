import { createMyProfilePage } from "./_profilePageBuilder";
import { Router } from "../router";

export function profileView(router: Router) {
    createMyProfilePage(router);
}