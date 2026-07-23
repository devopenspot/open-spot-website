I need refactor the data seed with the following these guidelines about the current state of the project:

re-write the current seed using the source file /spots.json to reply the data.

the current seed has incostencies in the data, about the cities, countries, regions, which must be review and fix it.

this error seems be related with cities, countries, regions, slugs and its naming.
An example of the incorrect behavior is this: there are rows such as spots located in Tel Aviv city in insrael, which are stored in the database, but when the user try filter spots by israel, the app it is not showing them.

some rows in /spots.json in its field slug are wrong, which must re-writes.
eg: { ..., slug: undefined-1784575845818}, { ..., slug: undefined-1784575969911}

this new seed must insert the full set of data in /spots.json its correct integrity with cities, countries, and regions, slugs, and naming; the naming must based on international English, avoiding special characters codes.

the data model is correct, you must avoid change its structure.

the changes only are related with seed data, nothing out of the scope must change.
