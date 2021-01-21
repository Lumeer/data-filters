import {Role} from '../model/role';
import {AllowedPermissions} from '../model/permissions';

export function hasRoleByPermissions(role: Role, permissions: AllowedPermissions): boolean {
    switch (role) {
        case Role.Read:
            return permissions?.readWithView;
        case Role.Write:
            return permissions?.writeWithView;
        case Role.Manage:
            return permissions?.manageWithView;
        default:
            return false;
    }
}
