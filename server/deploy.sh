#!/bin/bash

echo What should the version be?
read VERSION
echo $VERSION

docker build -t shadeemerhi/graphreddit:$VERSION .
docker push shadeemerhi/graphreddit:$VERSION
ssh root@159.223.180.68 "docker pull shadeemerhi/graphreddit:$VERSION && docker tag shadeemerhi/graphreddit:$VERSION dokku/api:$VERSION && dokku tags:deploy api $VERSION"
