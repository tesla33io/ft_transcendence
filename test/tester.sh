for i in $(seq 1 5); do
	echo "---- Request $i ----"
	curl -X POST localhost:5173/api/v1/game/test/multipleInstance
	echo -e "\n--------------------\n"
done

curl localhost:5173/api/v1/game/test/checkNumberBotInstance
