import { UPDATE_FUNCTION_ENDPOINT, INCONSISTENCIES_UPDATE_FUNCTION_ENDPOINT, COLLECTIONS_UPDATE_FUNCTION_ENDPOINT } from "../../common/config"

export const update = () => fetch(UPDATE_FUNCTION_ENDPOINT) // eslint-disable-line import/prefer-default-export
export const collectionsUpdate = () => fetch(COLLECTIONS_UPDATE_FUNCTION_ENDPOINT) // eslint-disable-line import/prefer-default-export
export const inconsistenciesUpdate = () => fetch(INCONSISTENCIES_UPDATE_FUNCTION_ENDPOINT) // eslint-disable-line import/prefer-default-export
