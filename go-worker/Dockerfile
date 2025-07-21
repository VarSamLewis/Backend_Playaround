FROM golang:1.23

WORKDIR /app

COPY . .

RUN go mod init worker && go mod tidy

RUN go mod tidy

RUN go build -o batcher .

CMD ["./batcher"]
