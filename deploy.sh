docker build -t keyprolabs/multi-fib:latest -t keyprolabs/multi-fib:$SHA -f ./client/Dockerfile ./client
docker build -t keyprolabs/fib-server:latest -t keyprolabs/fib-server:$SHA -f ./server/Dockerfile ./server
docker build -t keyprolabs/worker-fib:latest -t keyprolabs/worker-fib:$SHA -f ./worker/Dockerfile ./worker
docker push keyprolabs/multi-fib:latest
docker push keyprolabs/fib-server:latest
docker push keyprolabs/worker-fib:latest
docker push keyprolabs/multi-fib:$SHA
docker push keyprolabs/fib-server:$SHA
docker push keyprolabs/worker-fib:$SHA
kubectl apply -f k8s
kubectl set image deployments/server-deployment server=keyprolabs/fib-server:$SHA
kubectl set image deployments/client-deployment server=keyprolabs/multi-fib:$SHA
kubectl set image deployments/worker-deployment server=keyprolabs/worker-fib:$SHA