# Table of contents
- [Table of contents](#table-of-contents)
- [GET /api/test](#get-apitest)
- [GET /api/auth](#get-apiauth)
- [GET /api/session](#get-apisession)
- [POST /api/cover](#post-apicover)
- [GET /api/search/:query](#get-apisearchquery)
- [GET /api/stream/:id](#get-apistreamid)

# GET /api/test
Checks if the user session is valid.

Response 200: Session is up to date.  
Content-Type: `application/json`
```
{ success: "session up to date." }
```

Response 401: Session is expired.  
Content-Type: `application/json`
```
{ error: "session expired." }
```
[Back to top](#table-of-contents)

# GET /api/auth
Creates a new session for the user.

Headers:
```
authorization: Basic <base64 encoded username:token>
```

Response 200: User session is created.  
Content-Type: `application/json`
```
{ success: "Authorization successful."}
```

Response 400: `authorization` is missing in headers.  
Content-Type: `application/json`
```
{ error: "Basic authorization not given." }
```

Response 400: `user`, `token` pair is invalid.  
Content-Type: `application/json`
```
{ error: "Authorization failed." }
```
[Back to top](#table-of-contents)

# GET /api/session
Updates the session for the user. If the user session is already up to date, the session is not updated.

Headers:
```
authorization: Basic <base64 encoded username:token>
```

Response 200: User session is already up to date.  
Content-Type: `application/json`
```
{ success: "session up to date." }
```

Response 200: User session is updated.  
Content-Type: `application/json`
```
{ success: "Session refreshed." }
```

Response 400: `authorization` is missing in headers.  
Content-Type: `application/json`
```
{ error: "Basic authorization not given." }
```
[Back to top](#table-of-contents)

# POST /api/cover
[Needs authentication]  
Updates the cover image for the user.

Body:
```
FormData {
    cover: <image file>
}
```

Response 200: Cover image is updated.  
Content-Type: `application/json`
```
{cover: <cover filename>}
```

# GET /api/search/:query
[Needs authentication]  
Makes a search query to the database.

Route parameters:
```
query: <search query>
```

Response 200: Search query is successful.  
Content-Type: `application/json`
```
{
    data: [
        {
            cover: <object cover>,
            id: <object id>,
            title: <object title>,
            type: <object type>
        }
    ]
}
```

* cover field can be a URL string or a filename string.
* type field can be `artist`, `album`, `track`, `playlist`, `user`.

Response 400: `query` is missing in route parameters.  
Content-Type: `application/json`
```
{ error: "Query parameter not given." }
```

# GET /api/stream/:id
[Needs authentication]  
Streams the audio file for the track.

Route parameters:
```
id: <track id>
```

Response 200: Stream is successful.  
Content-Type: `audio/*`
```
<streamed audio file>
```

Response 400: `id` is missing in route parameters.  
Content-Type: `application/json`
```
{ error: "ID parameter not given." }
```