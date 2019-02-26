kubectl create -f namespace.yaml

kubectl create secret -n gates generic cert-secret --from-file=key=secrets/certificates/gates.key.pem --from-file=cert=secrets/certificates/gates.cert.cer
kubectl create secret -n gates generic config --from-file=conf=config.json

kubectl create -f frontend.yaml