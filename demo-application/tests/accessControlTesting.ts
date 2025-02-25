// todo: replace this with from 'access-control-testing' later
import { Act, Resource, User } from '../../src/api/index.ts'

const test = async () => {
  // todo: seed the database with testing data

  const user1 = new User('niklas.haug@tha.de', 'niklas.haug@tha.de')
  const adminUser1 = new User('admin', 'admin')
  const userResource = new Resource('User')

  // todo: type of identifier should be supplied by user
  adminUser1.owns(userResource)
  user1.owns(userResource)
  user1.canView(userResource) // should already be granted by owns
  user1.owns(userResource, 1)

  const resources = [userResource]
  const users = [user1, adminUser1]

  console.log('======')
  const act = new Act({
    apiBaseUrl: 'http://localhost:3333/',
    openApiUrl: 'http://localhost:3333/openapi.yml',
    users,
    resources,
  })
  await act.scan()
}

test()
