// todo: replace this with from 'access-control-testing' later
import { Act, User } from '../../src/api'

const test = async () => {
  // todo: seed the database with testing data

  const user1 = new User('user1', 'password')
  const user2 = new User('user2', 'password')
  const adminUser1 = new User('admin', 'admin')

  // second parameter is the authorization matrix, maps access types to required privileges
  /*  const todoResource = new Resource('Todo', {
    create: Privilege.CREATOR || Privilege.OWNER,
    read: Privilege.VIEWER || Privilege.OWNER,
    update: Privilege.EDITOR || Privilege.OWNER,
    delete: Privilege.OWNER, // OWNER is default for each access type
  })*/

  // pseudocode for defining relationships
  // openapi definition has defined for each route: type of ressource & type of access (create/read/update/delete)
  /* user1.owns(todoResource, 123)
  user2.canView(todoResource, 123)*/

  // relationships define the privileges a specific user has for a specific resource

  /*const users = [user1, adminUser1]
  const resources = [todoResource]*/

  console.log('======')
  // that way, tool users can use .env variables which would not be possible with the config file
  const act = new Act('http://localhost:3333')
  await act.scan()
}

test()
