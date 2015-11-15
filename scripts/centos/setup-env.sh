sudo mkdir -p <%= appRemote %>/<%= appName %>/
sudo mkdir -p <%= appRemote %>/<%= appName %>/config
sudo mkdir -p <%= appRemote %>/<%= appName %>/tmp

# Creating a system user
sudo useradd -r <%= appUser %>

sudo chown -R ${USER}:${USER} <%= appRemote %>/<%= appName %>
sudo chown <%= appUser %>:<%= appUser %> <%= appLog %>/meteor.log

# install firewalld
sudo yum install firewalld -y
#sudo npm install -g forever userdown wait-for-mongo node-gyp
